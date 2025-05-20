using Coesco.Models.Domain;
using Coesco.Models.Queries;
using Coesco.Utils.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Coesco.Services
{
    public class UserService : IUserService
    {
        private readonly Database _dbContext;

        public UserService(Database dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<User> GetByIdAsync(Guid id)
        {
            return await _dbContext.Users.FindAsync(id);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _dbContext.Users.ToListAsync();
        }

        public async Task<IEnumerable<User>> QueryAsync(UserQuery query)
        {
            IQueryable<User> result = _dbContext.Users;

            if (!string.IsNullOrEmpty(query.Username))
            {
                result = result.Where(u => u.Username.Contains(query.Username));
            }

            if (!string.IsNullOrEmpty(query.Email))
            {
                result = result.Where(u => u.Email.Contains(query.Email));
            }

            if (query.IsActive.HasValue)
            {
                result = result.Where(u => u.IsActive == query.IsActive.Value);
            }

            return await result.ToListAsync();
        }

        public async Task<User> CreateAsync(User user)
        {
            List<string> errors;
            if (!ValidateUser(user, out errors))
            {
                throw new Exception(string.Join(", ", errors));
            }

            user.Id = Guid.NewGuid();
            user.CreatedAt = DateTime.UtcNow;

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            List<string> errors;
            if (!ValidateUser(user, out errors))
            {
                throw new Exception(string.Join(", ", errors));
            }

            var existingUser = await _dbContext.Users.FindAsync(user.Id);
            if (existingUser == null)
            {
                throw new Exception($"User with ID {user.Id} not found");
            }

            // Update properties
            existingUser.Username = user.Username;
            existingUser.Email = user.Email;
            existingUser.IsActive = user.IsActive;

            await _dbContext.SaveChangesAsync();

            return existingUser;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public bool ValidateUser(User user, out List<string> errors)
        {
            errors = new List<string>();

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                errors.Add("Email is required");
            }

            if (string.IsNullOrWhiteSpace(user.Username))
            {
                errors.Add("Username is required");
            }

            return errors.Count == 0;
        }
    }
}