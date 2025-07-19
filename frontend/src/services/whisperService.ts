const API_BASE = 'http://localhost:8000/api';

export const whisperService = {
  async transcribeAudio(audioFile: File, language: string = 'auto'): Promise<{ transcription: string; filename: string }> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);

    const response = await fetch(`${API_BASE}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    return response.json();
  }
};