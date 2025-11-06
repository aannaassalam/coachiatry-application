import { User } from "./user.interface";

export interface EachTranscription {
  _id: string;
  name: string;
  profile: string;
  text: string;
  timestamp: string;
}

export interface Transcription {
  _id: string;
  title: string;
  user: User;
  transcriptions: EachTranscription[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
