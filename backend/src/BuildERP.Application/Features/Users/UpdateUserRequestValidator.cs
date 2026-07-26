using BuildERP.Domain.Constants;
using FluentValidation;

namespace BuildERP.Application.Features.Users;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Role).NotEmpty().Must(role => Domain.Constants.Roles.All.Contains(role))
            .WithMessage($"Role must be one of: {string.Join(", ", Domain.Constants.Roles.All)}");
    }
}
