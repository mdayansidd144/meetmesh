import { useCallback, useRef, useState } from "react";
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
export const useWebRTC = () => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const createPeer = useCallback(({ video, onIceCandidate, onRemoteTrack, onStateChange }) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate && onIceCandidate) onIceCandidate(e.candidate);
    };
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      if (onRemoteTrack) onRemoteTrack(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (onStateChange) onStateChange(pc.connectionState);
    };
    pcRef.current = pc;
    return pc;
  }, []);
  const getLocalStream = useCallback(async (video) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: 1280, height: 720 } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);
  const addLocalTracks = useCallback((pc) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getTracks().forEach((t) => {
      pc.addTrack(t, localStreamRef.current);
    });
  }, []);
  const createOffer = useCallback(async (pc) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, []);
  const acceptOffer = useCallback(async (pc, offer) => {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, []);
  const applyAnswer = useCallback(async (pc, answer) => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    for (const c of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {}
    }
    pendingCandidates.current = [];
  }, []);
  const addIceCandidate = useCallback(async (pc, candidate) => {
    if (!pc || !pc.remoteDescription) {
      pendingCandidates.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {}
  }, []);
  const toggleAudio = useCallback((enabled) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }, []);
  const toggleVideo = useCallback((enabled) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }, []);
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingCandidates.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  }, []);
  return {
    pcRef,
    localStreamRef,
    localStream,
    remoteStream,
    createPeer,
    getLocalStream,
    addLocalTracks,
    createOffer,
    acceptOffer,
    applyAnswer,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    cleanup,
  };
};
