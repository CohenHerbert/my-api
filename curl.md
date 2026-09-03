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

curl -X POST -F "file=@$HOME/Downloads/main.ts" http://localhost:3000/files/upload

curl -X GET http://localhost:3000/files

curl -o ~/Downloads/downloaded-file.ts http://localhost:3000/files/file-1788403081712-637202625
