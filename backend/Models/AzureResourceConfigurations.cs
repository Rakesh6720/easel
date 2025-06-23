using Azure.ResourceManager.Storage.Models;

namespace backend.Models;

// Configuration classes for different Azure resource types
public class AppServiceConfig
{
    public string? ServicePlanName { get; set; }
    public AppServiceSkuInfo? Sku { get; set; }
    public string? Kind { get; set; }
    public string? NetFrameworkVersion { get; set; }
    public bool? HttpsOnly { get; set; }
    public bool? AlwaysOn { get; set; }
    public Dictionary<string, string>? AppSettings { get; set; }
}

public class AppServiceSkuInfo
{
    public string? Name { get; set; }
    public string? Tier { get; set; }
    public string? Size { get; set; }
    public string? Family { get; set; }
    public int? Capacity { get; set; }
}

public class StorageConfig
{
    public StorageSkuInfo? Sku { get; set; }
    public StorageAccountAccessTier? AccessTier { get; set; }
    public bool? AllowBlobPublicAccess { get; set; }
    public bool? EnableHttpsTrafficOnly { get; set; }
    public StorageMinimumTlsVersion? MinimumTlsVersion { get; set; }
}

public class StorageSkuInfo
{
    public string? Name { get; set; }
}

public class SqlConfig
{
    public string? ServerName { get; set; }
    public string? AdminUsername { get; set; }
    public string? AdminPassword { get; set; }
    public SqlSkuInfo? Sku { get; set; }
    public string? Collation { get; set; }
    public long? MaxSizeBytes { get; set; }
}

public class SqlSkuInfo
{
    public string? Name { get; set; }
    public string? Tier { get; set; }
    public string? Size { get; set; }
}

public class AppServicePlanConfig
{
    public AppServiceSkuInfo? Sku { get; set; }
    public string? Kind { get; set; }
}