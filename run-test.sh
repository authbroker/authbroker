
MY_PATH="`dirname \"$0\"`"              # relative
MY_PATH="`( cd \"$MY_PATH\" && pwd )`"  # absolutized and normalized
if [ -z "$MY_PATH" ] ; then
    # error; for some reason, the path is not accessible
    # to the script (e.g. permissions re-evaled after suid)
    exit 1  # fail
fi
# echo "$MY_PATH"

if $(curl --output /dev/null --silent --head --fail http://localhost:8080); then
    echo "Keycloak is running"
else
    # Run Keycloak and Import demo data
    #docker-compose -f $MY_PATH/docker/docker-compose.yml up -d
    docker build -t authbroker:test .
    docker run -d -p 8080:8080 authbroker:test 
    #npm install

    attempt_counter=0
    max_attempts=100
    until $(curl --output /dev/null --silent --head --fail http://localhost:8080/auth); do
        if [ ${attempt_counter} -eq ${max_attempts} ];then
            echo "Max attempts reached"
            exit 1
        fi       
        printf '.'
        attempt_counter=$(($attempt_counter+1))
        sleep 10
    done
fi

echo ''
echo ''
echo 'Ready for running Tests...'
echo ''
echo 'for Running Test use this command:'
echo '$ npm run test'
echo ''
echo 'for Stopping Keycloak server use this command:'
echo '$ docker stop $(docker ps -a -q --filter ancestor=authbroker:test --format="{{.ID}}")'