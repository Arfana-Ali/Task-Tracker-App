export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data; // Add this line to include the data
    this.message = message;
    this.success = statusCode < 400;
  }
}
