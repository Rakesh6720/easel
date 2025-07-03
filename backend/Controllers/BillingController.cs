using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;
    private readonly ILogger<BillingController> _logger;

    public BillingController(IBillingService billingService, ILogger<BillingController> logger)
    {
        _billingService = billingService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }

    [HttpGet("data")]
    public async Task<ActionResult<BillingData>> GetBillingData()
    {
        try
        {
            var userId = GetCurrentUserId();
            var billingData = await _billingService.GetUserBillingDataAsync(userId);
            return Ok(billingData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing data for user");
            return StatusCode(500, new { message = "Failed to get billing data" });
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<BillingPeriod>>> GetBillingHistory([FromQuery] int? limit = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var history = await _billingService.GetBillingHistoryAsync(userId, limit);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing history for user");
            return StatusCode(500, new { message = "Failed to get billing history" });
        }
    }

    [HttpGet("cost-breakdown")]
    public async Task<ActionResult<List<CostBreakdownItem>>> GetCostBreakdown(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var breakdown = await _billingService.GetCostBreakdownAsync(userId, startDate, endDate);
            return Ok(breakdown);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost breakdown for user");
            return StatusCode(500, new { message = "Failed to get cost breakdown" });
        }
    }

    [HttpGet("project-cost-breakdown")]
    public async Task<ActionResult<List<ProjectCostBreakdownItem>>> GetProjectCostBreakdown(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var breakdown = await _billingService.GetProjectCostBreakdownAsync(userId, startDate, endDate);
            return Ok(breakdown);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project cost breakdown for user");
            return StatusCode(500, new { message = "Failed to get project cost breakdown" });
        }
    }

    [HttpGet("current-month-cost")]
    public async Task<ActionResult<decimal>> GetCurrentMonthCost()
    {
        try
        {
            var userId = GetCurrentUserId();
            var cost = await _billingService.GetCurrentMonthCostAsync(userId);
            return Ok(new { currentMonthlyCost = cost });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current month cost for user");
            return StatusCode(500, new { message = "Failed to get current month cost" });
        }
    }

    [HttpGet("budget")]
    public async Task<ActionResult<BudgetInfo>> GetBudgetInfo()
    {
        try
        {
            var userId = GetCurrentUserId();
            var budgetInfo = await _billingService.GetBudgetInfoAsync(userId);
            return Ok(budgetInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting budget info for user");
            return StatusCode(500, new { message = "Failed to get budget info" });
        }
    }

    [HttpGet("optimization-recommendations")]
    public async Task<ActionResult<List<CostOptimizationRecommendation>>> GetOptimizationRecommendations()
    {
        try
        {
            var userId = GetCurrentUserId();
            var recommendations = await _billingService.GetCostOptimizationRecommendationsAsync(userId);
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting optimization recommendations for user");
            return StatusCode(500, new { message = "Failed to get optimization recommendations" });
        }
    }
}