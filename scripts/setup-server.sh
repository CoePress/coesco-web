#!/bin/bash
set -euo pipefail

# =============================================================================
# COESCO Portal - Server Setup Script
# =============================================================================
# Usage: sudo ./setup-server.sh
#
# This script sets up a fresh Ubuntu/Debian server with:
# - Node.js 22 LTS
# - PostgreSQL 16
# - Progress OpenEdge ODBC dependencies
# - PM2 process manager
# - Nginx reverse proxy
# - Let's Encrypt SSL (certbot)
# =============================================================================

# Configuration
NODE_VERSION="22"
POSTGRES_VERSION="16"
APP_USER="coesco"
APP_DIR="/opt/coesco"
DOMAIN="${DOMAIN:-portal.cpec.com}"
API_DOMAIN="${API_DOMAIN:-api.portal.cpec.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------------------------
# Prerequisites Check
# -----------------------------------------------------------------------------
check_prerequisites() {
    log_info "Checking prerequisites..."

    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi

    if ! grep -qE "Ubuntu|Debian" /etc/os-release 2>/dev/null; then
        log_error "This script requires Ubuntu or Debian"
        exit 1
    fi

    if ! ping -c 1 google.com &>/dev/null; then
        log_error "No internet connectivity"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# -----------------------------------------------------------------------------
# System Updates
# -----------------------------------------------------------------------------
update_system() {
    log_info "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        unzip
}

# -----------------------------------------------------------------------------
# Node.js Installation
# -----------------------------------------------------------------------------
install_nodejs() {
    log_info "Installing Node.js ${NODE_VERSION}..."

    if command -v node &>/dev/null; then
        current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$current_version" == "$NODE_VERSION" ]]; then
            log_info "Node.js ${NODE_VERSION} already installed"
            return
        fi
    fi

    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs

    node --version
    npm --version

    npm install -g pm2

    log_info "Node.js installed successfully"
}

# -----------------------------------------------------------------------------
# PostgreSQL Installation
# -----------------------------------------------------------------------------
install_postgresql() {
    log_info "Installing PostgreSQL ${POSTGRES_VERSION}..."

    if command -v psql &>/dev/null; then
        log_info "PostgreSQL already installed"
        return
    fi

    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

    apt-get update
    apt-get install -y postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}

    systemctl start postgresql
    systemctl enable postgresql

    log_info "PostgreSQL installed successfully"
    log_warn "Create database with:"
    log_warn "  sudo -u postgres createuser coesco"
    log_warn "  sudo -u postgres createdb -O coesco coesco_portal"
}

# -----------------------------------------------------------------------------
# Progress OpenEdge ODBC Driver Installation
# -----------------------------------------------------------------------------
install_odbc() {
    log_info "Installing ODBC dependencies..."

    apt-get install -y unixodbc unixodbc-dev

    echo ""
    log_warn "========================================"
    log_warn "MANUAL STEP: Progress OpenEdge ODBC Driver"
    log_warn "========================================"
    log_warn ""
    log_warn "The Progress OpenEdge ODBC driver must be installed manually."
    log_warn ""
    log_warn "1. Download from Progress (requires license):"
    log_warn "   https://www.progress.com/openedge"
    log_warn ""
    log_warn "2. Install the driver package:"
    log_warn "   sudo dpkg -i progress-openedge-odbc_*.deb"
    log_warn ""
    log_warn "3. Configure /etc/odbcinst.ini:"
    log_warn "   [Progress OpenEdge 12.8 Driver]"
    log_warn "   Description=Progress OpenEdge 12.8 ODBC Driver"
    log_warn "   Driver=/usr/lib/progress/openedge/lib/pgoe1228.so"
    log_warn ""
    log_warn "4. Test connection:"
    log_warn "   isql -v 'your-dsn' username password"
    log_warn "========================================"
    echo ""
}

# -----------------------------------------------------------------------------
# Application User Setup
# -----------------------------------------------------------------------------
setup_app_user() {
    log_info "Setting up application user..."

    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -m -s /bin/bash "$APP_USER"
        log_info "Created user: $APP_USER"
    else
        log_info "User $APP_USER already exists"
    fi

    mkdir -p "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"

    log_info "Application directory: $APP_DIR"
}

# -----------------------------------------------------------------------------
# Application Setup
# -----------------------------------------------------------------------------
setup_application() {
    log_info "Setting up application directory structure..."

    mkdir -p "$APP_DIR"/{apps/server,apps/client/dist,logs,backups}

    if [[ ! -f "$APP_DIR/apps/server/.env" ]]; then
        cat > "$APP_DIR/apps/server/.env.example" << 'EOF'
# Copy this to .env and configure all values
PORT=8080
ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://coesco:password@localhost:5432/coesco_portal
ACCESS_TOKEN_SECRET=CHANGE_ME
ODBC_DRIVER={Progress OpenEdge 12.8 Driver}
PROSQL_USER=
PROSQL_PASSWORD=
STD_HOST=
STD_PORT=
STD_DB=
JOB_HOST=
JOB_PORT=
JOB_DB=
QUOTE_HOST=
QUOTE_PORT=
QUOTE_DB=
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_REDIRECT_URI=https://api.portal.cpec.com/v1/auth/microsoft/callback
GRAPH_ENCRYPTION_KEY=CHANGE_ME
CORS_ORIGINS=https://portal.cpec.com
EOF
        log_warn "Created .env.example - copy to .env and configure"
    fi

    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
}

# -----------------------------------------------------------------------------
# PM2 Configuration
# -----------------------------------------------------------------------------
setup_pm2() {
    log_info "Setting up PM2..."

    cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: "coesco-api",
      cwd: "/opt/coesco/apps/server",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        ENV: "production",
      },
      error_file: "/opt/coesco/logs/api-error.log",
      out_file: "/opt/coesco/logs/api-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
EOF

    chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

    # Setup PM2 startup
    env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"

    log_info "PM2 configured"
}

# -----------------------------------------------------------------------------
# Nginx Configuration
# -----------------------------------------------------------------------------
setup_nginx() {
    log_info "Installing and configuring Nginx..."

    apt-get install -y nginx

    # API config
    cat > /etc/nginx/sites-available/coesco-api << EOF
server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

    # Client config
    cat > /etc/nginx/sites-available/coesco-client << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    root ${APP_DIR}/apps/client/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    ln -sf /etc/nginx/sites-available/coesco-api /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/coesco-client /etc/nginx/sites-enabled/

    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default

    nginx -t
    systemctl reload nginx
    systemctl enable nginx

    log_info "Nginx configured for ${DOMAIN} and ${API_DOMAIN}"
}

# -----------------------------------------------------------------------------
# SSL Certificate Setup
# -----------------------------------------------------------------------------
setup_ssl() {
    log_info "Installing Certbot for SSL..."

    apt-get install -y certbot python3-certbot-nginx

    echo ""
    log_warn "========================================"
    log_warn "SSL CERTIFICATE SETUP"
    log_warn "========================================"
    log_warn ""
    log_warn "Run the following to obtain SSL certificates:"
    log_warn ""
    log_warn "  sudo certbot --nginx -d ${DOMAIN}"
    log_warn "  sudo certbot --nginx -d ${API_DOMAIN}"
    log_warn ""
    log_warn "Certbot will configure HTTPS and auto-renewal."
    log_warn "========================================"
    echo ""
}

# -----------------------------------------------------------------------------
# Firewall Configuration
# -----------------------------------------------------------------------------
setup_firewall() {
    log_info "Configuring firewall..."

    apt-get install -y ufw

    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'

    log_warn "Firewall configured but NOT enabled."
    log_warn "Review rules and run: sudo ufw enable"
}

# -----------------------------------------------------------------------------
# Create Deployment Script
# -----------------------------------------------------------------------------
create_deploy_script() {
    log_info "Creating deployment helper script..."

    cat > "$APP_DIR/deploy.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

APP_DIR="/opt/coesco"
cd "$APP_DIR"

echo "Installing server dependencies..."
npm ci --prefix apps/server --production

echo "Running database migrations..."
cd apps/server
npx prisma migrate deploy
cd ..

echo "Restarting application..."
pm2 reload ecosystem.config.js --env production

echo "Deployment complete!"
pm2 status
EOF

    chmod +x "$APP_DIR/deploy.sh"
    chown "$APP_USER:$APP_USER" "$APP_DIR/deploy.sh"

    log_info "Deploy script created at $APP_DIR/deploy.sh"
}

# -----------------------------------------------------------------------------
# Print Summary
# -----------------------------------------------------------------------------
print_summary() {
    echo ""
    log_info "========================================"
    log_info "SETUP COMPLETE"
    log_info "========================================"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Create PostgreSQL database:"
    echo "   sudo -u postgres createuser coesco"
    echo "   sudo -u postgres createdb -O coesco coesco_portal"
    echo ""
    echo "2. Install Progress OpenEdge ODBC driver (manual)"
    echo ""
    echo "3. Deploy application code to $APP_DIR/apps/"
    echo ""
    echo "4. Configure environment:"
    echo "   cp $APP_DIR/apps/server/.env.example $APP_DIR/apps/server/.env"
    echo "   nano $APP_DIR/apps/server/.env"
    echo ""
    echo "5. Install dependencies and migrate:"
    echo "   cd $APP_DIR/apps/server"
    echo "   npm ci --production"
    echo "   npx prisma migrate deploy"
    echo ""
    echo "6. Start application:"
    echo "   pm2 start $APP_DIR/ecosystem.config.js --env production"
    echo "   pm2 save"
    echo ""
    echo "7. Obtain SSL certificates:"
    echo "   sudo certbot --nginx -d ${DOMAIN}"
    echo "   sudo certbot --nginx -d ${API_DOMAIN}"
    echo ""
    echo "8. Enable firewall:"
    echo "   sudo ufw enable"
    echo ""
    echo "Application paths:"
    echo "  Server: $APP_DIR/apps/server"
    echo "  Client: $APP_DIR/apps/client"
    echo "  Logs:   $APP_DIR/logs"
    echo "  PM2:    $APP_DIR/ecosystem.config.js"
    echo ""
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    echo "========================================"
    echo "COESCO Portal - Server Setup"
    echo "========================================"
    echo ""

    check_prerequisites
    update_system
    install_nodejs
    install_postgresql
    install_odbc
    setup_app_user
    setup_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    create_deploy_script
    print_summary
}

main "$@"
