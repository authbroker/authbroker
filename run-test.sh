
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
    docker-compose -f $MY_PATH/docker/docker-compose.yml up -d
    
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

echo 'Running Tests'
npm run test

docker-compose -f $MY_PATH/docker/docker-compose.yml down