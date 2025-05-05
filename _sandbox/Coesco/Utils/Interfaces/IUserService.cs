using Coesco.Models.Domain;
using Coesco.Models.Queries;

namespace Coesco.Utils.Interfaces
{
    public interface IUserService
    {
        Task<User> GetByIdAsync(Guid id);
        Task<IEnumerable<User>> GetAllAsync();
        Task<IEnumerable<User>> QueryAsync(UserQuery query);
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(Guid id);
        bool ValidateUser(User user, out List<string> errors);
    }
}
