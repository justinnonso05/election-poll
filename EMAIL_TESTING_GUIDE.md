# Email Implementation - Testing Guide

## ✅ Fix Applied

**Issue**: 401 Unauthorized error from Brevo API
**Cause**: Incorrect API key authentication method
**Solution**: Changed from `setApiKey()` method to `authentications` property

## 🔧 What Was Fixed

### Before (Incorrect):
```typescript
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
```

### After (Correct):
```typescript
(apiInstance as any).authentications = {
  'api-key': apiKey
};
```

## 🧪 How to Test

### Test 1: Send to Single Voter
1. Go to Admin Dashboard → Voters
2. Find any voter in the table
3. Click the dropdown menu (⋮) next to the voter
4. Click "Send Credentials"
5. **Expected**: 
   - Loading toast appears
   - Success toast shows "Sent credentials to 1 voter(s)"
   - Check browser console for email stats
   - Check voter's email inbox

### Test 2: Send to Multiple Voters (Bulk)
1. Go to Admin Dashboard → Voters
2. Select 2-3 voters using checkboxes
3. Click "Send Credentials" button at the top
4. **Expected**:
   - Loading toast appears
   - Success toast shows "Sent credentials to X voters"
   - Check browser console for key rotation stats
   - All selected voters should receive emails

### Test 3: Verify Key Rotation
1. Send emails to 5+ voters
2. Check browser console output
3. **Expected**: You should see stats like:
```json
{
  "keyUsageStats": [
    { "key": "xsmtpsib-7...", "usage": 3, "limit": 100 },
    { "key": "xsmtpsib-f...", "usage": 2, "limit": 100 }
  ]
}
```

## 📧 Email Content Verification

The voter should receive an email with:
- **Subject**: "Your Voting Credentials - Election Poll"
- **From**: "Election Poll <noreply@duespay.app>"
- **Content**:
  - Voter's name
  - Email address
  - Student ID
  - Password
  - Login button linking to `/voter/login`

## 🐛 Troubleshooting

### If you still get 401 error:
1. Verify API keys in `.env` are correct
2. Check that keys start with `xsmtpsib-`
3. Verify keys are active in Brevo dashboard
4. Ensure `duespay.app` domain is verified in Brevo

### If emails don't arrive:
1. Check spam/junk folder
2. Verify sender email `noreply@duespay.app` is verified in Brevo
3. Check Brevo dashboard for delivery logs
4. Verify voter email addresses are valid

### If you get rate limit errors:
1. Increase delay in `brevo-service.ts` line 135:
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 200)); // Increase from 100ms
   ```
2. Decrease `MAX_EMAILS_PER_KEY` if needed

## 📊 Monitoring

Check the browser console after sending emails to see:
- Total emails sent
- Successful sends
- Failed sends
- Key usage statistics

Example output:
```javascript
Email stats: [
  { key: "xsmtpsib-7...", usage: 3, limit: 100 },
  { key: "xsmtpsib-f...", usage: 2, limit: 100 }
]
```

## 🔐 Security Notes

- API keys are rotated automatically
- Only authenticated admins can send emails
- Admins can only send to voters in their association
- All email operations are logged

## 📝 Next Steps

1. Test with a single voter first
2. Verify email arrives and looks correct
3. Test bulk sending with 2-3 voters
4. Monitor key rotation in console
5. Add more API keys if needed (see EMAIL_IMPLEMENTATION.md)

## ⚠️ Important Reminders

- **Sender Email**: Must be from `@duespay.app` domain (verified in Brevo)
- **API Keys**: Must be valid Brevo transactional email API keys
- **Rate Limits**: Brevo free tier has daily limits (check your plan)
- **Password Security**: Currently sending plain text passwords (as requested)

## 🎯 Success Criteria

✅ No 401 errors in console
✅ Success toast appears
✅ Emails arrive in inbox
✅ Email content is correctly formatted
✅ Key rotation works (check console stats)
✅ Both individual and bulk sending work
