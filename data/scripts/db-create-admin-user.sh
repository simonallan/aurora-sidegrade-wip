#!/bin/bash

declare -a dbEndpoints=(
  # wip-aurora-sandbox-target.cijbd5cnppmo.eu-west-2.rds.amazonaws.com
  ofr-admin-application-integration-mariadb.cijbd5cnppmo.eu-west-2.rds.amazonaws.com
)

declare -a mysqlCommands=(
    # CREATE USER 'drupal'@'%' IDENTIFIED BY '$NEWPASSW';
    # GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, RELOAD, PROCESS, REFERENCES, INDEX, ALTER, SHOW DATABASES, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, REPLICATION SLAVE, REPLICATION CLIENT, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, CREATE USER, EVENT, TRIGGER ON *.* TO 'drupal'@'%';
)

homeDir="/home/as2-streaming-user/MyFiles/"
configFile=$homeDir"config.cnf"
outputFile=$homeDir"db-schema-validation.txt"

# Create config file to cache credentials for automatic mysql login
for dbEndpoint in "${dbEndpoints[@]}"
do
    echo "---------------------------"
    date
    echo "---------------------------"

    # Read-in db user name, write it to file
    touch $configFile
    echo "[client]" > $configFile
    echo "host='$dbEndpoint'" >> $configFile
    read -sp "Enter an admin username for $dbEndpoint: " DBADMIN && printf "\n"
    echo "user='$DBADMIN'" >> $configFile
    read -sp "Enter a password for $DBADMIN: " PASSW "\n"
    echo "password='$PASSW'" >> $configFile && export PASSW=''
    echo ""
    echo "Connecting to $dbEndpoint with user $DBADMIN"
    echo ""
    echo "Creating new database admin user"
    # read -sp "Enter a username for database $dbEndpoint: " NEWUSER "\n"
    # read -sp "Enter a password for new DB user $NEWUSER: " NEWPASSW "\n"


    for command in "${mysqlCommands[@]}"
    do
        echo "Executing command: $command"
        mysql \
        --defaults-extra-file=$configFile \
        --execute="$command"
        echo ""
    done
    rm -f $configFile
done
