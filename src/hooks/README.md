# hooks

Custom React hooks that encapsulate reusable stateful logic for UI feedback and browser APIs.

## Files

| File | Description |
|------|-------------|
| `useToast.jsx` | Hook that manages a stack of toast notifications and exposes `showToast`, `removeToast`, and a `ToastContainer` component for rendering them. |
| `useVoice.jsx` | Hook wrapping the Web Speech API to provide speech-to-text recognition, text-to-speech synthesis, voice selection, and persisted default-voice preferences. |
