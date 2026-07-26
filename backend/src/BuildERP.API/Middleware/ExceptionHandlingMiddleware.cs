using System.Net;
using System.Text.Json;
using BuildERP.Application.Common.Exceptions;

namespace BuildERP.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var problemDetails = new
        {
            title = "An error occurred while processing your request.",
            status = (int)HttpStatusCode.InternalServerError,
            detail = exception.Message,
            errors = (IDictionary<string, string[]>?)null
        };

        var statusCode = HttpStatusCode.InternalServerError;

        switch (exception)
        {
            case NotFoundException:
                statusCode = HttpStatusCode.NotFound;
                _logger.LogWarning(exception, "Resource not found");
                problemDetails = problemDetails with { title = "Resource not found.", status = (int)statusCode };
                break;
            case ValidationAppException validationException:
                statusCode = HttpStatusCode.BadRequest;
                _logger.LogWarning(exception, "Validation failure");
                problemDetails = problemDetails with
                {
                    title = "One or more validation errors occurred.",
                    status = (int)statusCode,
                    errors = validationException.Errors
                };
                break;
            case ForbiddenAccessException:
                statusCode = HttpStatusCode.Forbidden;
                _logger.LogWarning(exception, "Forbidden access");
                problemDetails = problemDetails with { title = "You do not have permission to perform this action.", status = (int)statusCode };
                break;
            case AuthenticationException:
                statusCode = HttpStatusCode.Unauthorized;
                _logger.LogWarning(exception, "Authentication failure");
                problemDetails = problemDetails with { title = "Authentication failed.", status = (int)statusCode };
                break;
            default:
                _logger.LogError(exception, "Unhandled exception");
                break;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }
}
