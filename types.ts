export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface FormAnalysisResponse {
  translated_user_intent: string;
  form_field_coordinates: [number, number, number, number] | null; // ymin, xmin, ymax, xmax
  native_language_response: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
