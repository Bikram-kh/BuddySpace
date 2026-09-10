# 🚀 Quick Setup: reCAPTCHA v3

## 1️⃣ Create reCAPTCHA v3 Site (2 min)

Go to: https://www.google.com/recaptcha/admin

1. Click **"Create"** (+ icon)
2. Fill in:
   - **Label:** `BuddySpace`
   - **reCAPTCHA type:** Select **v3**
   - **Domains:** 
     - `localhost`
     - (your-domain.com when ready)
3. Accept terms → **Submit**

## 2️⃣ Copy Your Site Key (30 sec)

After creating, you'll see:
```
Site Key: 6Lc...  (COPY THIS)
Secret Key: 6Lc... (KEEP SAFE)
```

## 3️⃣ Add to .env.local (30 sec)

Create or edit `.env.local` in your project root:

```bash
# .env.local
VITE_RECAPTCHA_SITE_KEY=6Lc...your_site_key_here...
```

⚠️ **Important:** Never share the Secret Key. Only use it in backend code.

## 4️⃣ Test It

### In Development:
```bash
npm run dev
```
1. Go to signup
2. Notice reCAPTCHA notice at bottom: *"This site is protected by reCAPTCHA..."*
3. Try signing up
4. Check browser DevTools (F12) → Console
5. You should see: `reCAPTCHA token obtained for signup`

### Check Network Tab
- Open DevTools → Network tab
- Try signup
- Look for request to `google.com/recaptcha`
- Should see Status 200 ✓

## 5️⃣ Deploy

When deploying to production (e.g., Vercel):
1. Go to your hosting provider settings (Vercel, Netlify, etc.)
2. Add Environment Variable:
   - Name: `VITE_RECAPTCHA_SITE_KEY`
   - Value: Your site key
3. Redeploy
4. Add your production domain to reCAPTCHA admin console

## ✅ You're Done!

reCAPTCHA v3 is now protecting your signup/login from bots.

---

## Troubleshooting

### Error: "Security verification failed"
- Missing or wrong `VITE_RECAPTCHA_SITE_KEY`
- Domain not added to reCAPTCHA admin console
- Solution: Refresh page after adding env var

### Not seeing reCAPTCHA badge?
- It's at the bottom of the login form
- Very discreet by design (no popup)
- Check CSS: search for `.recaptcha-notice` in styles.css

### Still having issues?
- Check console for errors (F12)
- Verify site key is correct
- Try incognito mode (clear cache)
- Contact: support@google.com/recaptcha (Google's issue)

---

## Security Note

**What reCAPTCHA does:**
- ✅ Detects bots automatically
- ✅ Zero user friction (no popups)
- ✅ Sends "bot score" to your backend

**What you need to do next (Phase 3):**
- Backend should verify the score
- Reject if score < 0.5 (definitely a bot)
- Log suspicious activity

More info: https://developers.google.com/recaptcha/docs/v3

---

**Questions?** See AUTHENTICATION_SECURITY_GUIDE.md for the full setup guide.
