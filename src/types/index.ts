export interface Process {
  id: string;
  currentSlot: number | null;
  targetSlot: number | null;
  loading: boolean;
}
