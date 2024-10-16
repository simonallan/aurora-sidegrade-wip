# Simple script for DB Backups

dbendpoint="ofr-admin-application-integration.cluster-cijbd5cnppmo.eu-west-2.rds.amazonaws.com"
dbname="cruk_fundraising"

hostId=$(echo "$dbendpoint" | cut -d'.' -f1)
homeDir="/home/as2-streaming-user/MyFiles"
dumpfile=$homeDir"/mysqldump-$hostId.sql"

# Create config file to cache credentials for automatic mysql login
echo "----------------------------"
echo "- Mysqldump Utility Script -"
date
echo "----------------------------"

# Read-in db user name, write it to file
read -sp "Enter a username for $dbendpoint: " DBUSER && printf "\n"
echo ""
echo "Creating mysqldump file at $dumpfile"
echo "Hostname: $dbendpoint"
echo "User: $DBUSER"
echo "Database: $dbname"
echo ""
mysqldump \
  --set-gtid-purged=OFF \
  --single-transaction \
  -h ${dbendpoint} -u ${DBUSER} -p ${PASSD} \
  ${dbname} > ${dumpfile}
