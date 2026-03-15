# 🌐 DOMAIN SETUP GUIDE - TOX Express Delivery Services

## 🎯 **GET YOUR CUSTOM DOMAIN** (toxexpress.com)

### **Option 1: Namecheap (Recommended - $8.98/year)**

#### Step 1: Register Domain
1. Go to: https://namecheap.com
2. Search: `toxexpress.com`
3. Click "Add to Cart"
4. Create account or login
5. Complete checkout ($8.98 + tax)

#### Step 2: Get Hosting (Same Provider)
1. In Namecheap, go to "Hosting" tab
2. Choose "Stellar Plus" plan ($2.88/month)
3. Select your domain
4. Complete purchase
5. **Total Cost: $43.54/year**

#### Step 3: DNS Configuration
After hosting is active, you'll get an email with your hosting IP address.

In Namecheap Domain Manager:
1. Go to "Domain List" → Click your domain
2. Click "Advanced DNS"
3. Delete existing A records
4. Add new A record:
   ```
   Type: A
   Host: @
   Value: [YOUR_HOSTING_IP_FROM_EMAIL]
   TTL: Automatic
   ```
5. Save changes
6. **Wait 24-48 hours for DNS to propagate**

---

### **Option 2: Hostinger (Domain + Hosting Bundle)**

#### Step 1: Domain + Hosting
1. Go to: https://hostinger.com
2. Click "Web Hosting"
3. Choose "Premium" plan ($2.99/month)
4. In domain search: `toxexpress.com`
5. Check "I want to transfer/register a domain"
6. **Domain is FREE** with hosting plan
7. Complete purchase
8. **Total Cost: $35.88/year**

#### Step 2: Automatic Setup
- Domain and hosting are automatically connected
- No DNS configuration needed
- SSL certificate auto-installed

---

### **Option 3: GoDaddy (Popular Choice)**

#### Step 1: Register Domain
1. Go to: https://godaddy.com
2. Search: `toxexpress.com`
3. Add to cart ($9.99 + ICANN fee)
4. Complete purchase

#### Step 2: Get Hosting
1. In GoDaddy, go to "Web Hosting"
2. Choose "Economy" plan ($2.99/month)
3. Select your domain during checkout
4. **Total Cost: $47.88/year**

#### Step 3: DNS Setup
1. Login to GoDaddy
2. Go to "My Products" → Domain
3. Click DNS settings
4. Add A record:
   ```
   Type: A
   Name: @
   Value: [HOSTING_IP]
   TTL: 600
   ```

---

## 🔧 **HOSTING CONTROL PANEL ACCESS**

### **Namecheap cPanel:**
- URL: `https://yourservername.web-hosting.com:2083`
- Username/Password: In welcome email

### **Hostinger hPanel:**
- URL: `https://hpanel.hostinger.com`
- Login with your Hostinger account

### **GoDaddy cPanel:**
- URL: Provided in welcome email
- Usually: `https://[account].secureserver.net`

---

## 📁 **FILE UPLOAD METHODS**

### **Method 1: File Manager (Easiest)**
1. Login to hosting control panel
2. Find "File Manager" or "Files"
3. Navigate to `public_html` folder
4. Click "Upload"
5. Select all files from your `TRANSPORT WORLD` folder
6. Wait for upload to complete

### **Method 2: FTP Upload**
1. Download FileZilla: https://filezilla-project.org
2. Get FTP credentials from hosting welcome email
3. Connect using:
   ```
   Host: Your domain or IP
   Username: From email
   Password: From email
   Port: 21
   ```
4. Upload all files to `public_html` folder

### **Method 3: SSH/SFTP (Advanced)**
1. Use FileZilla with SFTP
2. Port: 22
3. Upload to `/public_html`

---

## ⚙️ **NODE.JS SETUP**

### **For cPanel Hosting:**
1. Login to cPanel
2. Find "Node.js" or "Application Manager"
3. Click "Create Application"
4. Fill in:
   ```
   Application URL: /
   Application root: public_html
   Application startup file: server.js
   Node.js version: 18.x
   ```
5. Click "Create"
6. Application starts automatically

### **For VPS/Cloud Hosting:**
1. SSH into server
2. Navigate to website folder: `cd public_html`
3. Install dependencies: `npm install`
4. Start server: `npm start`
5. Setup PM2: `npm install -g pm2 && pm2 start server.js`

---

## 🔒 **SSL CERTIFICATE SETUP**

### **Automatic (Recommended):**
1. Login to hosting panel
2. Find "SSL/TLS" or "Security"
3. Click "Free SSL" or "Let's Encrypt"
4. Select your domain
5. Click "Install"
6. **Done! HTTPS enabled**

### **Manual Verification:**
- Visit: `https://toxexpress.com`
- Look for green lock icon
- Test: `http://` should redirect to `https://`

---

## 🧪 **TESTING CHECKLIST**

### **Website Tests:**
- [ ] `https://toxexpress.com` loads
- [ ] All pages work (home, contact, tracking)
- [ ] Mobile responsive
- [ ] Contact form submits
- [ ] Shipment tracking works

### **Admin Tests:**
- [ ] `https://toxexpress.com/admin.html` loads
- [ ] Login works: `ToxExpress2024Admin`
- [ ] Dashboard shows data
- [ ] Shipment management works
- [ ] Visitor tracking active

### **Performance Tests:**
- [ ] Page load < 3 seconds
- [ ] Images load properly
- [ ] No console errors (F12)
- [ ] SSL certificate valid

---

## 🎯 **GO LIVE CHECKLIST**

### **Pre-Launch:**
- [ ] Domain registered and pointing to hosting
- [ ] All files uploaded successfully
- [ ] Node.js server running
- [ ] SSL certificate active
- [ ] Admin password changed
- [ ] All tests passed

### **Launch Day:**
- [ ] Final backup of files
- [ ] Clear browser cache
- [ ] Test from different devices
- [ ] Submit to Google Search Console
- [ ] Setup Google Analytics
- [ ] Create social media profiles

### **Post-Launch:**
- [ ] Monitor server performance
- [ ] Check visitor analytics
- [ ] Respond to admin notifications
- [ ] Update content as needed
- [ ] Setup automated backups

---

## 🚨 **COMMON ISSUES & FIXES**

### **"Site Not Found":**
- Wait 24-48 hours for DNS propagation
- Check DNS settings are correct
- Clear DNS cache: `ipconfig /flushdns` (Windows)

### **"500 Internal Server Error":**
- Check Node.js application is running
- Review server logs in hosting panel
- Verify all dependencies installed

### **Admin Login Not Working:**
- Verify password (case sensitive)
- Check server.js is running
- Clear browser cache/cookies

### **SSL Not Working:**
- Wait 24 hours after installation
- Check domain DNS is correct
- Contact hosting support

---

## 📊 **SUCCESS VERIFICATION**

### **Immediate Success Signs:**
- ✅ Green HTTPS lock in browser
- ✅ Website loads without errors
- ✅ Admin dashboard accessible
- ✅ Domain resolves correctly

### **24-Hour Success Signs:**
- ✅ Google Search Console verification
- ✅ Basic visitor tracking in admin
- ✅ Contact form data saving
- ✅ Shipment tracking functional

### **Week 1 Success Signs:**
- ✅ Google indexing pages
- ✅ Consistent visitor traffic
- ✅ Admin activity logging
- ✅ Positive user feedback

---

## 💰 **FINAL COST SUMMARY**

### **Recommended Setup (Namecheap):**
```
Domain: $8.98/year
Hosting: $34.56/year ($2.88/month)
SSL: FREE
Total: $43.54/year
```

### **Premium Setup (Hostinger):**
```
Domain: FREE (with hosting)
Hosting: $35.88/year ($2.99/month)
SSL: FREE
Professional Email: $19.99/year (optional)
Total: $35.88/year (or $55.87 with email)
```

### **Business Setup (GoDaddy):**
```
Domain: $9.99/year + ICANN fee
Hosting: $35.88/year ($2.99/month)
SSL: FREE
Total: ~$50/year
```

---

## 🎉 **LAUNCH COMPLETE!**

### **Your Professional Business Site:**
```
🌐 Website: https://toxexpress.com
👨‍💼 Admin: https://toxexpress.com/admin.html
📊 Dashboard: https://toxexpress.com/dashboard.html
📧 Email: info@toxexpress.com (setup separately)
```

### **What You Now Own:**
✅ Professional domain name
✅ Enterprise-grade website
✅ Full admin control system
✅ Real-time visitor tracking
✅ Shipment management platform
✅ Secure HTTPS encryption
✅ Google search visibility
✅ Professional business presence

**Your TOX Express Delivery Services company is now LIVE and ready for business! 🚢💼**

---

*Need help? Contact your hosting provider's support or check the troubleshooting section above.*
</content>
<parameter name="filePath">c:\Users\MY PC\Desktop\TRANSPORT WORLD\DOMAIN_SETUP_GUIDE.md