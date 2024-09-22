while inotifywait -r .; do
    rsync -av package.json build /mnt/c/Users/Blond/Desktop/yaak-cognito-auth
done
