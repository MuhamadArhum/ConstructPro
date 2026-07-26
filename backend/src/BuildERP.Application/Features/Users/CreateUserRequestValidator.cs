using BuildERP.Domain.Constants;
using FluentValidation;

namespace BuildERP.Application.Features.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Role).NotEmpty().Must(role => Domain.Constants.Roles.All.Contains(role))
            .WithMessage($"Role must be one of: {string.Join(", ", Domain.Constants.Roles.All)}");
    }
}
