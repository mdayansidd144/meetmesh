import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Phone,
} from "lucide-react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({
  role,
  peer,
  incomingOffer,
  video,
  socketRef,
  userId,
  callerName,
  onClose,
  logCall,
}) {
  const [status, setStatus] = useState(
    role === "caller" ? "calling" : "incoming"
  );
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(video);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const loggedRef = useRef(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("call:answered", async ({ answer }) => {
      try {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setStatus("active");
        setStartTime(Date.now());
        flushPendingCandidates();
      } catch (err) {
        setError("Could not connect the call");
      }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      try {
        if (!pcRef.current) return;
        if (!pcRef.current.remoteDescription) {
          pendingCandidates.current.push(candidate);
          return;
        }
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Ice error", err);
      }
    });

    socket.on("call:declined", () => {
      setError("Call declined");
      finalizeCall("declined");
      setTimeout(() => cleanup(false), 800);
    });

    socket.on("call:ended", () => {
      setError("Call ended");
      finalizeCall("answered");
      setTimeout(() => cleanup(false), 800);
    });

    return () => {
      socket.off("call:answered");
      socket.off("call:ice-candidate");
      socket.off("call:declined");
      socket.off("call:ended");
    };
  }, []);

  useEffect(() => {
    if (role === "caller") {
      startCall();
    }
    return () => {
      cleanup(false);
    };
  }, []);

  const finalizeCall = (status) => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    const duration = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;
    if (logCall) {
      logCall({
        type: video ? "call_video" : "call_voice",
        status,
        duration,
      });
    }
  };

  const flushPendingCandidates = async () => {
    if (!pcRef.current) return;
    for (const c of pendingCandidates.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      } catch {}
    }
    pendingCandidates.current = [];
  };

  const createPeer = async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: 1280, height: 720 } : false,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current && video) {
      localVideoRef.current.srcObject = stream;
    }
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("call:ice-candidate", {
          to: peer._id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("active");
        if (!startTime) setStartTime(Date.now());
      }
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        setError("Connection lost");
        finalizeCall("answered");
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      const pc = await createPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("call:initiate", {
        from: userId,
        to: peer._id,
        offer,
        callerName: callerName || peer.username,
        video,
      });
    } catch (err) {
      setError("Could not access your camera or microphone");
    }
  };

  const acceptCall = async () => {
    try {
      const pc = await createPeer();
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("call:answer", { to: peer._id, answer });
      setStatus("active");
      setStartTime(Date.now());
      await flushPendingCandidates();
    } catch (err) {
      setError("Could not accept the call");
    }
  };

  const declineCall = () => {
    socketRef.current?.emit("call:decline", { to: peer._id });
    finalizeCall("declined");
    cleanup(false);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !cameraOn;
    });
    setCameraOn((c) => !c);
  };

  const cleanup = (notifyPeer = true) => {
    if (notifyPeer) {
      socketRef.current?.emit("call:end", { to: peer._id });
      finalizeCall("answered");
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    onClose();
  };

  if (status === "incoming") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-6">
        <div className="card-dark w-full max-w-sm p-8 text-center fade-up">
          <div className="w-20 h-20 mx-auto rounded-full avatar-sapphire text-3xl">
            {peer.username?.[0]?.toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">
            {peer.username}
          </h2>
          <p className="text-sm text-blue-100/70 mt-1">
            {video ? "Incoming video call" : "Incoming voice call"}
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition"
              aria-label="Decline"
            >
              <PhoneOff className="w-6 h-6" strokeWidth={2} />
            </button>
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition"
              aria-label="Accept"
            >
              <Phone className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
        {video ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 left-3 text-xs text-white bg-blue-500/90 px-3 py-1 rounded-lg">
              You
            </span>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full avatar-sapphire text-4xl">
                {peer.username?.[0]?.toUpperCase()}
              </div>
              <p className="mt-4 text-sm text-blue-100/70">Voice call</p>
            </div>
          </div>
        )}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/15">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-3 left-3 text-xs text-white bg-black/60 px-3 py-1 rounded-lg">
            {peer.username}
          </span>
          {status === "calling" && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
              <p className="text-white text-sm animate-pulse">
                Calling {peer.username}
              </p>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="text-center text-sm text-red-400 pb-2">{error}</p>
      )}
      <div className="pb-6 flex justify-center items-center gap-4">
        <button
          onClick={toggleMute}
          className={
            muted
              ? "w-12 h-12 rounded-full flex items-center justify-center transition bg-blue-500 text-white"
              : "w-12 h-12 rounded-full flex items-center justify-center transition bg-white/10 text-white hover:bg-white/20"
          }
          aria-label="Toggle microphone"
        >
          {muted ? (
            <MicOff className="w-5 h-5" strokeWidth={2} />
          ) : (
            <Mic className="w-5 h-5" strokeWidth={2} />
          )}
        </button>
        {video && (
          <button
            onClick={toggleCamera}
            className={
              !cameraOn
                ? "w-12 h-12 rounded-full flex items-center justify-center transition bg-blue-500 text-white"
                : "w-12 h-12 rounded-full flex items-center justify-center transition bg-white/10 text-white hover:bg-white/20"
            }
            aria-label="Toggle camera"
          >
            {cameraOn ? (
              <VideoIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <VideoOff className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        )}
        <button
          onClick={() => cleanup(true)}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}