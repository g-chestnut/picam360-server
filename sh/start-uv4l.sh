CMD="/usr/bin/uv4l --driver raspicam --auto-video_nr $1 --encoding rgb24 --server-option '--port=9000'"
echo ${CMD}
${CMD}
sudo chrt -a -r -p 99 `pgrep uv4l`