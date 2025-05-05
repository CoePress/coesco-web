namespace Coesco.Models.Queries
{
    public class UserQuery
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public bool? IsActive { get; set; }
        public string SortBy { get; set; }
        public bool SortDescending { get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }
}