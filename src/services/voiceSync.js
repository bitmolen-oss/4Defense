// Usługa WebRTC dla czatu głosowego 3v3
export class VoiceSync {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.isMuted = false;
    this.isDeafened = false;
    this.roomId = null;
    this.userId = null;
    
    // Konfiguracja STUN/TURN serwerów (zmień na swoje)
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Dodaj własne TURN serwery dla produkcyjnego środowiska
    ];
  }
  
  // Inicjalizacja mikrofonu
  async initializeAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Dołączenie do pokoju głosowego
  async joinVoiceRoom(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    
    const audioResult = await this.initializeAudio();
    if (!audioResult.success) {
      return audioResult;
    }
    
    // Tutaj powinna być logika połączenia z serwerem sygnalizacyjnym
    // i negocjacji WebRTC z innymi graczami
    
    console.log(`Dołączono do pokoju głosowego: ${roomId}`);
    return { success: true };
  }
  
  // Utworzenie połączenia WebRTC z innym graczem
  async createPeerConnection(remoteUserId) {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
      });
      
      // Dodaj lokalny strumień audio
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Obsługa przychodzących strumieni
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        this.remoteStreams.set(remoteUserId, remoteStream);
        
        // Emituj zdarzenie do UI
        window.dispatchEvent(new CustomEvent('voice_user_connected', {
          detail: { userId: remoteUserId, stream: remoteStream }
        }));
      };
      
      // Obsługa ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Wyślij kandydata ICE do zdalnego użytkownika
          this.sendIceCandidate(remoteUserId, event.candidate);
        }
      };
      
      // Obsługa zmian stanu połączenia
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`Stan połączenia z ${remoteUserId}: ${state}`);
        
        if (state === 'disconnected' || state === 'failed') {
          this.remoteStreams.delete(remoteUserId);
          this.peerConnections.delete(remoteUserId);
          
          window.dispatchEvent(new CustomEvent('voice_user_disconnected', {
            detail: { userId: remoteUserId }
          }));
        }
      };
      
      this.peerConnections.set(remoteUserId, peerConnection);
      return { success: true, peerConnection };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Rozpoczęcie negocjacji (jako oferujący)
  async createOffer(remoteUserId) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      const result = await this.createPeerConnection(remoteUserId);
      if (!result.success) return result;
    }
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Wyślij ofertę do zdalnego użytkownika
      this.sendSignalingMessage(remoteUserId, {
        type: 'offer',
        sdp: offer,
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Odpowiedź na ofertę (jako odpowiadający)
  async createAnswer(remoteUserId, offer) {
    let peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      const result = await this.createPeerConnection(remoteUserId);
      if (!result.success) return result;
      peerConnection = result.peerConnection;
    }
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Wyślij odpowiedź do zdalnego użytkownika
      this.sendSignalingMessage(remoteUserId, {
        type: 'answer',
        sdp: answer,
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Obsługa odpowiedzi
  async handleAnswer(remoteUserId, answer) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) return { success: false, error: 'Brak połączenia' };
    
    try {
      await peerConnection.setRemoteDescription(answer);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Obsługa ICE candidates
  async handleIceCandidate(remoteUserId, candidate) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) return { success: false, error: 'Brak połączenia' };
    
    try {
      await peerConnection.addIceCandidate(candidate);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Wyciszenie mikrofonu
  toggleMute() {
    if (!this.localStream) return;
    
    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    this.isMuted = !this.isMuted;
    
    window.dispatchEvent(new CustomEvent('voice_mute_changed', {
      detail: { isMuted: this.isMuted }
    }));
  }
  
  // Wyciszenie dźwięku
  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    
    // Wycisz wszystkie zdalne strumienie
    this.remoteStreams.forEach((stream, userId) => {
      const audioElements = document.querySelectorAll(`audio[data-user-id="${userId}"]`);
      audioElements.forEach(element => {
        element.muted = this.isDeafened;
      });
    });
    
    window.dispatchEvent(new CustomEvent('voice_deafen_changed', {
      detail: { isDeafened: this.isDeafened }
    }));
  }
  
  // Opuszczenie pokoju głosowego
  leaveVoiceRoom() {
    // Zatrzymaj lokalny strumień
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Zamknij wszystkie połączenia
    this.peerConnections.forEach((peerConnection, userId) => {
      peerConnection.close();
      this.remoteStreams.delete(userId);
    });
    
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.roomId = null;
    this.userId = null;
    this.isMuted = false;
    this.isDeafened = false;
    
    console.log('Opuszczono pokój głosowy');
  }
  
  // Metody sygnalizacyjne (do zaimplementowania z backendem)
  sendSignalingMessage(remoteUserId, message) {
    // Wyślij wiadomość przez WebSocket lub Supabase Realtime
    console.log(`Wysyłanie wiadomości do ${remoteUserId}:`, message);
    
    // Przykład użycia Supabase:
    // supabase.channel(`voice_${this.roomId}`).send({
    //   type: 'broadcast',
    //   event: 'signaling',
    //   payload: {
    //     targetUserId: remoteUserId,
    //     fromUserId: this.userId,
    //     message,
    //   },
    // });
  }
  
  sendIceCandidate(remoteUserId, candidate) {
    this.sendSignalingMessage(remoteUserId, {
      type: 'ice_candidate',
      candidate,
    });
  }
  
  // Gettery
  isMutedState() {
    return this.isMuted;
  }
  
  isDeafenedState() {
    return this.isDeafened;
  }
  
  getConnectedUsers() {
    return Array.from(this.remoteStreams.keys());
  }
  
  isConnected() {
    return this.roomId !== null;
  }
}

// Singleton dla łatwego dostępu
export const voiceSync = new VoiceSync();
