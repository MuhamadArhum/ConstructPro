namespace BuildERP.Application.Common.Models;

public class Result
{
    protected Result(bool succeeded, IEnumerable<string> errors)
    {
        Succeeded = succeeded;
        Errors = errors.ToArray();
    }

    public bool Succeeded { get; }

    public string[] Errors { get; }

    public static Result Success() => new(true, Array.Empty<string>());

    public static Result Failure(IEnumerable<string> errors) => new(false, errors);
}

public class Result<T> : Result
{
    protected Result(bool succeeded, T? data, IEnumerable<string> errors) : base(succeeded, errors)
    {
        Data = data;
    }

    public T? Data { get; }

    public static Result<T> Success(T data) => new(true, data, Array.Empty<string>());

    public static new Result<T> Failure(IEnumerable<string> errors) => new(false, default, errors);
}
