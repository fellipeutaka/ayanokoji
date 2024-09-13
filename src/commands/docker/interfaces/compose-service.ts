export interface ComposeService {
  image: string;
  environment: Record<string, string>;
  ports: string[];
}
