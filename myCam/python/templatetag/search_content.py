from urllib import parse
from django import template
import re
import pycurl
import random

register = template.Library()

'''
지역 체크
'''
@register.simple_tag
def region(URL):
	try:
		URL = parse.unquote(URL)
		region = URL.split("region=")[1]
		region = region.split("&dong=")[0]
		if region =="all":
			return -1
		elif region =="서울특별시":
			return 0
		elif region =="대전광역시":
			return 1
		else:
			return 2
	except IndexError as e:
		print("지역 반환{0}".format(e))
		return -1

'''
동 체크
'''
@register.simple_tag
def dong(URL):
	try:
		URL = parse.unquote(URL)
		dong = URL.split("&dong=")[1]
		if dong =="all":
			return -1
		elif dong == "역삼동" or dong == "둔산동" or dong =="해운대":
			return 0
		else:
			return 1
	except IndexError as e:
		print("동 반환{0}".format(e))
		return -1


'''
ccvt 갯수 체크
'''
@register.simple_tag
def cctv_num(list_length):
	list = []
	for i in range(1,list_length):
		list.append(i)
	return list

'''
형변환
'''
@register.simple_tag
def stringToInt():
	randomNum = random.randint(1,20)
	strNum = str(randomNum)
	img_path = 'images/m/m'+ strNum +'.jpg'
	return img_path