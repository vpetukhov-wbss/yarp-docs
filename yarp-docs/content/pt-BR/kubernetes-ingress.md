---
slug: kubernetes-ingress
title: Controlador de Ingress do Kubernetes
lede: >-
  O YARP pode ser integrado ao Kubernetes como um proxy reverso que gerencia o tráfego HTTP/HTTPS
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Introduzido: Future Preview

O YARP pode ser integrado ao Kubernetes como um proxy reverso que gerencia o tráfego HTTP/HTTPS de entrada (ingress) em um cluster do Kubernetes. Atualmente, o módulo é distribuído como um pacote separado e está em versão prévia.

## Pré-requisitos

Antes de continuar este tutorial, verifique se você tem o seguinte pronto...

1. Instalar o Docker de acordo com o seu sistema operacional.

2. Um registro de contêiner. Por padrão, o Docker cria um registro de contêiner no DockerHub. Você também pode usar o Azure Container Registry ou outro registro de contêiner de sua escolha, como um registro local para testes.

1. Um cluster do Kubernetes. Há muitas opções diferentes disponíveis, incluindo:

Azure Kubernetes Service Kubernetes no Docker Desktop, porém ele consome bastante memória na sua máquina, então use com cautela. Minikube K3s, uma distribuição Kubernetes certificada, leve e de binário único, da Rancher. Outro provedor de Kubernetes de sua escolha.

Observação

Se você escolher um registro de contêiner fornecido por um provedor de nuvem diferente do DockerHub, provavelmente precisará realizar etapas para configurar seu cluster do Kubernetes de modo a permitir o acesso. Siga as instruções fornecidas pelo seu provedor de nuvem.

## Primeiros passos

:::note
Por enquanto, não há uma imagem oficial do Docker para o controlador de ingress do YARP.
:::

Enquanto isso, o controlador de ingress do YARP precisa ser compilado localmente e implantado. Na raiz do

repositório, execute:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

Nos comandos anteriores, o espaço reservado {REGISTRY_NAME} é o nome do registro do Docker, e o espaço reservado {TAG} é uma tag para a imagem (por exemplo, 1.0.0).

O primeiro passo é implantar o controlador de ingress do YARP no cluster do Kubernetes. Isso pode ser feito navegando até o exemplo Kubernetes Ingress em \samples\KubernetesIngress.Sample\Ingress e executando (depois de modificar o arquivo ingress-controller.yaml com o mesmo REGISTRY_NAME e TAG):

## kubectl apply -f ingress-controller.yaml

Para verificar se o controlador de ingress foi implantado, execute:

## kubectl get pods -n yarp

Em seguida, você pode verificar os logs do controlador de ingress executando:

kubectl logs {POD NAME} -n yarp

Todos os serviços, implantações e pods do YARP estão no namespace yarp. Não deixe de incluir -n yarp caso queira verificar o status do yarp. Em seguida, compile e implante o ingress. Na raiz do repositório, execute:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

Nos comandos anteriores, o espaço reservado {REGISTRY_NAME} é o nome do

registro do Docker, e o espaço reservado {TAG} é uma tag para a imagem (por exemplo, 1.0.0).

Por fim, precisamos implantar o próprio ingress no Kubernetes. Navegue até o diretório Ingress, modifique o arquivo ingress.yaml com o registro e a tag especificados anteriormente e execute:

## kubectl apply -f .\ingress.yaml

Neste ponto, seu ingress e o controlador já devem estar em execução.

## Implantando um aplicativo

Para usar o ingress, agora precisamos implantar um aplicativo no Kubernetes. Navegue até samples\KuberenetesIngress.Sample\backend e execute:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

E implantando-o no Kubernetes ao executar, depois de modificar o backend.yaml com o mesmo nome de registro ({REGISTRY_NAME}) e tag ({TAG}):

## kubectl apply -f .\backend.yaml

## Criando a definição do ingress

Por fim, depois de implantar o aplicativo de backend, precisamos rotear o tráfego para ele. Para isso, execute no diretório backend:

## kubectl apply -f .\ingress-sample.yaml

Em seguida, execute o seguinte comando para obter o IP externo do ingress; o nome do serviço relacionado é yarp-proxy:

## kubectl get service -n yarp

Se você estiver usando um cluster K8s local e não obtiver um IP externo, talvez seja possível evitar o uso da porta padrão: 80 para o serviço yarp-proxy. Nesse caso, tente atualizar novamente o arquivo ingress.yaml para usar outra porta (por exemplo, port: 8085) e reimplante o ingress no Kubernetes.

Acesse o IP externo e você deverá ver as informações do backend.

:::note
O autor criou este artigo com a ajuda de IA. Saiba mais
:::
