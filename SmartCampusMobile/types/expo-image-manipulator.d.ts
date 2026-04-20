declare module 'expo-image-manipulator' {
  export interface Action {
    resize?: { width?: number; height?: number };
    rotate?: number;
    flip?: { vertical?: boolean; horizontal?: boolean };
    crop?: { originX: number; originY: number; width: number; height: number };
  }
  export function manipulateAsync(
    uri: string,
    actions: Action[],
    options?: { format?: 'png' | 'jpeg'; compress?: number }
  ): Promise<{ uri: string; width: number; height: number }>;
}
