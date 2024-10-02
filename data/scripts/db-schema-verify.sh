#!/bin/bash

declare -a dbendpoints=(
  # wip-aurora-sandbox-target
  wip-aurora-sandbox-source.cluster-cijbd5cnppmo.eu-west-2.rds.amazonaws.com
  # wip-aurora-sandbox-target.cijbd5cnppmo.eu-west-2.rds.amazonaws.com
)

declare -a statusCommands=(
    "STATUS;"
    "SELECT version();"
    "SELECT TABLE_NAME AS 'Table', ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 ,2) AS 'Size (MB)' FROM information_schema.TABLES WHERE TABLE_SCHEMA ='cruk_fundraising' ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC LIMIT 10;"
    "select DISTINCT(DATA_TYPE) from INFORMATION_SCHEMA.COLUMNS"
    "select DATA_TYPE from INFORMATION_SCHEMA.COLUMNS"
)

homeDir="/home/as2-streaming-user/MyFiles/"
configfile=$homeDir"config.cnf"
outputFile=$homeDir"db-schema-validation.txt"

# Create config file to cache credentials for automatic mysql login
for dbendpoint in "${dbendpoints[@]}"
do
    echo "---------------------------"
    date
    echo "---------------------------"

    # Read-in db user name, write it to file
    touch $configfile
    echo "[client]" > $configfile
    echo "host='$dbendpoint'" >> $configfile
    read -sp "Enter a username for $dbendpoint: " DBUSER && printf "\n"
    echo "user='$DBUSER'" >> $configfile
    read -sp "Enter a password for $DBUSER: " PASSW && printf "\n"
    echo "password='$PASSW'" >> $configfile && export PASSW=''
    echo ""
    echo "Connecting to $dbendpoint with user $DBUSER"

    for command in "${statusCommands[@]}"
    do
        echo "Executing command: $command"
        mysql \
        --defaults-extra-file=$configfile \
        --execute="$command"
        echo ""
    done
    rm -f $configfile
done
