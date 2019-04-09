from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render

# Create your views here.
@csrf_exempt 
def index(request):
	return render(request,'myHome/index.html',{})
@csrf_exempt 
def contents(request):
	return render(request,'myHome/contents.html',{})
@csrf_exempt 
def dogFind(request):
	return render(request,'myHome/dogFind.html',{})
		
