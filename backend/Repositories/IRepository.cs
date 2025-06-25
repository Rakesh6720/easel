using System.Linq.Expressions;

namespace backend.Repositories;

/// <summary>
/// Generic repository interface providing common CRUD operations
/// </summary>
/// <typeparam name="T">Entity type</typeparam>
public interface IRepository<T> where T : class
{
    // Query operations
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
    Task<int> CountAsync();
    Task<int> CountAsync(Expression<Func<T, bool>> predicate);
    
    // Query with includes
    Task<T?> GetByIdWithIncludesAsync(int id, params Expression<Func<T, object>>[] includes);
    Task<IEnumerable<T>> GetAllWithIncludesAsync(params Expression<Func<T, object>>[] includes);
    Task<IEnumerable<T>> FindWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
    
    // Paging
    Task<IEnumerable<T>> GetPagedAsync(int skip, int take);
    Task<IEnumerable<T>> GetPagedAsync(Expression<Func<T, bool>> predicate, int skip, int take);
    
    // Ordering
    Task<IEnumerable<T>> GetOrderedAsync<TKey>(Expression<Func<T, TKey>> keySelector, bool ascending = true);
    Task<IEnumerable<T>> GetPagedOrderedAsync<TKey>(Expression<Func<T, TKey>> keySelector, int skip, int take, bool ascending = true);
    
    // Modification operations
    Task<T> AddAsync(T entity);
    Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities);
    Task UpdateAsync(T entity);
    Task UpdateRangeAsync(IEnumerable<T> entities);
    Task DeleteAsync(T entity);
    Task DeleteAsync(int id);
    Task DeleteRangeAsync(IEnumerable<T> entities);
    Task DeleteRangeAsync(Expression<Func<T, bool>> predicate);
    
    // Transaction support
    Task<int> SaveChangesAsync();
}