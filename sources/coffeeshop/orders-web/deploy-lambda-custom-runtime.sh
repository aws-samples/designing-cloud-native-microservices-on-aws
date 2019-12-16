#!/usr/bin/env bash

APPDIR=target/
BUNDLEDIR=target/bundle

function bundle() {

    #mvn clean package -Pnative  -DskipTests=true -Dnative=true -Dsvm.platform=org.graalvm.nativeimage.impl.InternalPlatform$LINUX_JNI_AMD64
    mvn clean package -DskipTests=true -Dnative=true -Dnative-image.docker-build=true -Dsvm.platform=org.graalvm.nativeimage.impl.InternalPlatform$LINUX_JNI_AMD64
    
    mkdir -p ${BUNDLEDIR}
    cp -r target/wiring-classes/bootstrap ${APPDIR}/*-runner  ${BUNDLEDIR}
    # shellcheck disable=SC2016
    #sed -i 's/$RUNNER/$RUNNER -Djava.net.preferIPv4Stack=true -Djava.library.path=\/opt\/graalvm\/jre\/lib\/amd64 -Djavax.net.ssl.trustStore=\/opt\/graalvm\/jre\/lib\/security\/cacerts/g' ${BUNDLEDIR}/bootstrap
    sed -i 's/$RUNNER/$RUNNER -Djava.net.preferIPv4Stack=true -Djava.library.path=\/opt\/graalvm\/jre\/lib\/amd64 -Djavax.net.ssl.trustStore=\/opt\/graalvm\/jre\/lib\/security\/cacerts/g' ${BUNDLEDIR}/bootstrap    
    

    #chmod 755 ${BUNDLEDIR}/bootstrap
    # copy to outside and zip for deploying
    #cd ${BUNDLEDIR} && zip -q function.zip bootstrap *-runner ; cd -
    
    cp bootstrap $BUNDLEDIR/
    chmod 755 $BUNDLEDIR/bootstrap
    cd $BUNDLEDIR && zip -q function.zip bootstrap *-runner ; cd -
    

}

[ -z "$NOBUNDLE" ] && bundle

sls deploy
