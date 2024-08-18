declare namespace MusicKit {
    interface MusicKitInstance {
      authorize(): Promise<string>;
      // 여기에 MusicKitInstance에서 필요한 다른 메서드 및 속성을 추가하세요
    }
  
    interface ConfigureParams {
      developerToken: string;
      app: {
        name: string;
        build: string;
      };
    }
  
    function configure(params: ConfigureParams): MusicKitInstance;
  }