using BuildERP.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace BuildERP.Infrastructure.Identity;

public class WebRootPathProvider : IWebRootPathProvider
{
    public WebRootPathProvider(IWebHostEnvironment env)
    {
        WebRootPath = env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
    }

    public string WebRootPath { get; }
}
