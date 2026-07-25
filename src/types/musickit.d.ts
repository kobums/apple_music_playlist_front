export {};

declare global {
  namespace MusicKit {
    interface ConfigureParams {
      developerToken: string;
      app: {
        name: string;
        build: string;
      };
    }

    interface MusicKitInstance {
      /** Resolves with the Music User Token. */
      authorize(): Promise<string>;
      unauthorize(): Promise<void>;
      readonly isAuthorized: boolean;
      readonly musicUserToken?: string;
      readonly storefrontId?: string;
    }
  }

  interface MusicKitStatic {
    /** MusicKit v3 resolves with the instance; v1 returned it synchronously. */
    configure(params: MusicKit.ConfigureParams): Promise<MusicKit.MusicKitInstance>;
    getInstance(): MusicKit.MusicKitInstance | undefined;
  }

  interface Window {
    MusicKit?: MusicKitStatic;
  }
}
