using System.Text.Json.Serialization;

namespace memora_backend.Dtos;

public class ApiResponse<T>
{
    /// <summary>
    /// Indicates whether the request was successful
    /// </summary>
    [JsonPropertyName("success")]
    public bool IsSuccess { get; set; }

    /// <summary>
    /// HTTP status code of the response
    /// </summary>
    [JsonPropertyName("status")]
    public int Status { get; set; }

    /// <summary>
    /// The main data payload
    /// </summary>
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    /// <summary>
    /// Error details
    /// </summary>
    [JsonPropertyName("errors")]
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Create a successful response
    /// </summary>
    public static ApiResponse<T> Success(T data, int statusCode = 200)
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Status = statusCode,
            Data = data
        };
    }

    /// <summary>
    /// Create an error response with a single error message
    /// </summary>
    public static ApiResponse<T> Error(string errorMessage, int statusCode = 400)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Status = statusCode,
            Errors = new List<string> { errorMessage }
        };
    }

    /// <summary>
    /// Create an error response with multiple error messages
    /// </summary>
    public static ApiResponse<T> Error(List<string> errorMessages, int statusCode = 400)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Status = statusCode,
            Errors = errorMessages
        };
    }
}

// Optional: Status Code Constants for clarity
public static class StatusCodes
{
    public const int OK = 200;
    public const int Created = 201;
    public const int BadRequest = 400;
    public const int Unauthorized = 401;
    public const int Forbidden = 403;
    public const int NotFound = 404;
    public const int InternalServerError = 500;
}
