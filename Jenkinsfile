pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'travel-planner'
        DOCKER_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}", ".")
                }
            }
        }

        stage('Push to Registry') {
            when {
                expression { env.DOCKER_REGISTRY }
            }
            steps {
                script {
                    docker.withRegistry("https://${env.DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Image built: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            echo "Run with: docker run -p 3000:3000 -e DATABASE_URL=... ${DOCKER_IMAGE}:${DOCKER_TAG}"
        }
    }
}
