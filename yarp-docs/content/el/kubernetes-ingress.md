---
slug: kubernetes-ingress
title: Ελεγκτής Ingress του Kubernetes
lede: >-
  Το YARP μπορεί να ενσωματωθεί με το Kubernetes ως αντίστροφος διακομιστής μεσολάβησης που
  διαχειρίζεται την κυκλοφορία HTTP/HTTPS
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Παρουσιάστηκε: Future Preview

Το YARP μπορεί να ενσωματωθεί με το Kubernetes ως αντίστροφος διακομιστής μεσολάβησης που διαχειρίζεται την είσοδο (ingress) κυκλοφορίας HTTP/HTTPS σε ένα cluster Kubernetes. Επί του παρόντος, η μονάδα διανέμεται ως ξεχωριστό πακέτο και βρίσκεται σε προεπισκόπηση (preview).

## Προαπαιτούμενα

Πριν συνεχίσουμε με αυτό το σεμινάριο, βεβαιωθείτε ότι έχετε έτοιμα τα εξής...

1. Εγκατάσταση του Docker ανάλογα με το λειτουργικό σας σύστημα.

2. Ένα container registry. Το Docker από προεπιλογή δημιουργεί ένα container registry στο DockerHub . Μπορείτε επίσης να χρησιμοποιήσετε το Azure Container Registry ή ένα άλλο container registry της επιλογής σας, όπως ένα τοπικό registry για δοκιμές.

1. Ένα cluster Kubernetes. Υπάρχουν πολλές διαφορετικές επιλογές εδώ, όπως:

Azure Kubernetes Service Kubernetes σε Docker Desktop , ωστόσο καταναλώνει αρκετή μνήμη στον υπολογιστή σας, οπότε χρησιμοποιήστε το με προσοχή. Minikube K3s , μια ελαφριά, πιστοποιημένη διανομή Kubernetes ενός εκτελέσιμου (single-binary) από τη Rancher. Κάποιος άλλος πάροχος Kubernetes της επιλογής σας.

Σημείωση

Αν επιλέξετε ένα container registry που παρέχεται από κάποιον πάροχο cloud διαφορετικό από το Dockerhub, πιθανότατα θα χρειαστεί να προβείτε σε ενέργειες για να διαμορφώσετε το cluster Kubernetes ώστε να επιτρέπεται η πρόσβαση. Ακολουθήστε τις οδηγίες που παρέχει ο πάροχος cloud σας.

## Ξεκινώντας

:::note
Προς το παρόν, δεν υπάρχει επίσημη εικόνα Docker για τον ελεγκτή YARP ingress.
:::

Στο μεταξύ, ο ελεγκτής YARP ingress πρέπει να δημιουργηθεί (built) τοπικά και να αναπτυχθεί. Στη ρίζα του

αποθετηρίου, εκτελέστε:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

Στις παραπάνω εντολές, το placeholder {REGISTRY_NAME} είναι το όνομα του Docker registry και το placeholder {TAG} είναι μια ετικέτα (tag) για την εικόνα (για παράδειγμα, 1.0.0 ).

Το πρώτο βήμα είναι η ανάπτυξη του ελεγκτή YARP ingress στο cluster Kubernetes. Αυτό μπορεί να γίνει μεταβαίνοντας στο δείγμα Kubernetes Ingress \samples\KubernetesIngress.Sample\Ingress και εκτελώντας (αφού τροποποιήσετε το ingress- controller.yaml με τα ίδια REGISTRY_NAME και TAG ):

## kubectl apply -f ingress-controller.yaml

Για να επαληθεύσετε ότι ο ελεγκτής ingress έχει αναπτυχθεί, εκτελέστε:

## kubectl get pods -n yarp

Στη συνέχεια, μπορείτε να ελέγξετε τα logs του ελεγκτή ingress εκτελώντας:

kubectl logs {POD NAME} -n yarp

Όλες οι υπηρεσίες, αναπτύξεις (deployments) και pods για το YARP βρίσκονται στο namespace yarp . Φροντίστε να συμπεριλάβετε το -n yarp αν θέλετε να ελέγξετε την κατάσταση του yarp. Στη συνέχεια, δημιουργήστε και αναπτύξτε το ingress. Στη ρίζα του αποθετηρίου, εκτελέστε:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

Στις παραπάνω εντολές, το placeholder {REGISTRY_NAME} είναι το

όνομα του Docker registry και το placeholder {TAG} είναι μια ετικέτα (tag) για την εικόνα (για παράδειγμα, 1.0.0).

Τέλος, χρειάζεται να αναπτύξουμε το ίδιο το ingress στο Kubernetes. Μεταβείτε στον κατάλογο Ingress, τροποποιήστε το αρχείο ingress.yaml με το registry και το tag που καθορίσατε νωρίτερα, και εκτελέστε:

## kubectl apply -f .\ingress.yaml

Σε αυτό το σημείο, το ingress και ο ελεγκτής σας θα πρέπει να εκτελούνται.

## Ανάπτυξη μιας εφαρμογής

Για να χρησιμοποιήσετε το ingress, χρειάζεται τώρα να αναπτύξουμε μια εφαρμογή στο Kubernetes. Μεταβείτε στο samples\KuberenetesIngress.Sample\backend και εκτελέστε:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

Και αναπτύξτε την στο Kubernetes εκτελώντας, αφού τροποποιήσετε το backend.yaml με το ίδιο όνομα registry ( {REGISTRY_NAME} ) και tag ( {TAG} ):

## kubectl apply -f .\backend.yaml

## Δημιουργία του ορισμού ingress

Τέλος, αφού έχουμε αναπτύξει την εφαρμογή backend, χρειάζεται να δρομολογήσουμε την κυκλοφορία προς το backend. Για να το κάνετε αυτό, εκτελέστε στον κατάλογο backend:

## kubectl apply -f .\ingress-sample.yaml

Και στη συνέχεια εκτελέστε την παρακάτω εντολή για να λάβετε την εξωτερική IP του ingress, με το όνομα της σχετικής υπηρεσίας να είναι yarp-proxy :

## kubectl get service -n yarp

Αν χρησιμοποιείτε ένα τοπικό cluster K8s και δεν λαμβάνετε εξωτερική IP, ίσως μπορέσετε να αποφύγετε τη χρήση της προεπιλεγμένης θύρας: 80 για την υπηρεσία yarp-proxy. Αν συμβαίνει αυτό, δοκιμάστε να ενημερώσετε ξανά το αρχείο ingress.yaml ώστε να χρησιμοποιεί μια άλλη θύρα (για παράδειγμα, port: 8085 ) και αναπτύξτε ξανά το ingress στο Kubernetes.

Μεταβείτε στην εξωτερική IP και θα πρέπει να δείτε τις πληροφορίες του backend.

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
