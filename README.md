### Overview
This demo Web app shows how to use RingCentral SMS API to implement a 2-Factor Authentication (2FA) service.

2FA helps prevent brute force attacks and protect user's accounts.

### Use case 1: Protect a user account from brute force attacks.
After 3 unsuccessful attempts were made to log into a user's account, the account will be temporarily locked. The service will generate a 6-digit verification code and send the code to the user's mobile phone number. The user has to use the verification code to unlock his/her account. The verification code can be used only one time and it also expires after 1 hour. If the verification code is incorrect, or if the verification code expired, the user has to request for a new verification code.

### Use case 2: Prevent taking over login control.
When a user wants to reset the login password. The service will generate a 6-digit verification code and send the code to the user's mobile phone number. The user has to use the verification code to set a new password for his/her account. The verification code can be used only one time and it also expires after 1 hour. If the verification code is incorrect, or if the verification code expired, the user has to request for a new verification code.

### RingCentral Connect Platform
RingCentral Connect Platform is a rich RESTful API platform with more than 60 APIs for business communication includes advanced voice calls, chat messaging, SMS/MMS and Fax.

### RingCentral Developer Portal
To setup a free developer account, click [https://developer/ringcentral.com](here)

### How to run the demo
* Click the Signup tab and complete the signup form to create an account. Use a real phone number!
* Click the Login tab and try to login 3 times with an incorrect password.
* Check your SMS message to get the verification code.
* Enter the verification code to unlock the account.

### Clone the project
```
git clone https://github.com/ringcentral-tutorials/2f-auth-node

cd 2f-auth-node

npm intall --save
```
