# Simple script for DB Backups

# dbendpoint="ofr-admin-application-integration-mariadb.cijbd5cnppmo.eu-west-2.rds.amazonaws.com"
dbendpoint="ofr-admin-application-production-mariadb.cwdv9vks4lal.eu-west-2.rds.amazonaws.com" # Migration target
dbname="cruk_fundraising"

hostId=$(echo "$dbendpoint" | cut -d'.' -f1)
homeDir="/home/as2-streaming-user/MyFiles"

# dumpfile=$homeDir"/mysqldump-ofr-admin-application-integration.sql"
dumpfile=$homeDir"/mysqldump-ofr-admin-application-production.sql"


# Create config file to cache credentials for automatic mysql login
echo "--------------------------------"
echo "- Mysql Restore Utility Script -"
date
echo "--------------------------------"

# Read-in db user name, write it to file
read -sp "Enter a username for $dbendpoint: " DBUSER && printf "\n"
echo ""
echo "Restoring backup $dumpfile"
echo "To database host $dbendpoint"
echo "User: $DBUSER"
echo "Database: $dbname"
echo ""
mysql \
  -h ${dbendpoint} -u ${DBUSER} -p ${PASSD} \
  ${dbname} < ${dumpfile}
