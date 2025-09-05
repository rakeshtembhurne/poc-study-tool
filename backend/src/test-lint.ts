// Backend test file with intentional formatting issues
import { Injectable } from "@nestjs/common";

@Injectable()
export class TestService {
  private readonly data: string = "test";

  async getData(param1: string, param2: number): Promise<string> {
    const result = param1 + param2;
    return result;
  }

  private unusedMethod() {
    console.log("unused");
  }
}
