unameOut="$(uname -s)"
case "${unameOut}" in
    CYGWIN*)    com=./rsync;;
    MINGW*)     com=./rsync;;
    *)          com=rsync
esac
echo ${machine}

if [ ! -f ~/decode/username.txt ]; then
    read -p "Write your name without uppercase: "
    echo "$REPLY" > ~/decode/username.txt
fi

username_d=`cat ~/decode/username.txt`
username="$(echo -e "${username_d}" | tr -cd '[:alpha:]')"

echo "your username: $username"
$com -ardtv ~/decode --exclude 'node_modules/' --exclude '*flv' --exclude upload.sh --exclude username.txt --exclude .git --exclude rsync.exe rsync://165.227.37.255:12000/files/$username
