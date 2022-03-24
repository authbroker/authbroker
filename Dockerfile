FROM jboss/keycloak

COPY ./docker/import_realm /opt/jboss/keycloak/import

ENV KEYCLOAK_USER admin
ENV KEYCLOAK_PASSWORD admin
ENV KEYCLOAK_IMPORT /opt/jboss/keycloak/import

EXPOSE 8080

CMD ["-Dkeycloak.migration.action=import", "-Dkeycloak.migration.provider=dir", "-Dkeycloak.migration.dir=/opt/jboss/keycloak/import", "-Dkeycloak.profile.feature.upload_scripts=enabled", "-Dkeycloak.migration.strategy=OVERWRITE_EXISTING"]