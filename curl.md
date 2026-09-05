curl -X POST http://localhost:3000/users/register \
-H "Content-Type: application/json" \
-d '{
"username": "johndoe",
"password": "securepassword123",
"name": "John Doe"
}'

curl -X GET http://localhost:3000/users

curl -X POST http://localhost:3000/users/login \
-H "Content-Type: application/json" \
-d '{
"username": "johndoe",
"password": "securepassword123"
}'

curl -X POST -F "file=@$HOME/Downloads/test.ts" http://localhost:3000/files/upload \
-H "Authorization: Bearer ..."

curl -X GET http://localhost:3000/files

curl -o ~/Downloads/downloaded-file.ts http://localhost:3000/files/...
