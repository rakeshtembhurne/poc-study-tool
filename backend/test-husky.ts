// Test file for backend Husky pre-commit hooks
// This file has intentional formatting and linting issues

export class TestService {
  private data: string = "test";

  public getData(): string {
    return this.data;
  }

  public setData(value: string): void {
    this.data = value;
  }
}

// Missing semicolon, inconsistent spacing
const testFunction = () => {
  console.log("Testing backend hooks");
};

export default testFunction;
