import numpy as numpy
import matplotlib.pyplot as plt

datafile = 'ProgrammingFonts.csv'

names = []
count = []
serifs = []
serifed_i = []
mono = []

f = open(datafile, 'r')
for i, x in enumerate(f):
    if(i > 0):
        data = x.split(',')
        names.append(data[0].capitalize())
        count.append(int(data[1]))
        serifs.append(data[2])
        mono.append(data[3])
        serifed_i.append(data[4].strip())
f.close()

total = sum(count)
print('n fonts: ' + str(len(count)) + ', total responses: ' + str(total))

n_named = 5
names_clipped = names.copy()
for i in range(n_named, len(names)):
    names_clipped[i] = ''

# Pie Chart
plt.figure(figsize=(5,5))
plt.title('Distribution of Programming\nFont Preferences')
plt.pie(count, wedgeprops=dict(width=0.2), labels = names_clipped)
plt.savefig('font_preference_breakdown.jpg')

# Mono:
is_mono = [0 if x[0:2] == 'no' else 1 for x in mono]
mono_weighted = [x[0]*x[1] for x in zip(is_mono, count)]
mono_count = sum(mono_weighted)
mono_dist = [100.0 * mono_count / total, 100.0*(1.0 - mono_count /total)]

plt.figure(figsize=(5,5))
plt.bar([0], mono_dist[1], bottom = mono_dist[0], width = 0.5, color = '#f46542')
plt.bar([0], mono_dist[0], width = 0.5, color = '#41c7f4')
plt.xlim([-0.3, 0.7])
plt.ylim([0,100])
plt.xticks([])
plt.ylabel('Percentage')
plt.title('Use of Monospaced Fonts')
plt.legend(['Proportional', 'Monospaced'], loc='upper right')
plt.savefig('monospace_preference.jpg')

#Serif:
is_serifed = [1 if x == 'yes' else 0 for x in serifs]
serif_weighted = [x[0]*x[1] for x in zip(is_serifed, count)]
serif_count = sum(serif_weighted)
serif_dist = [100.0*(1.0 - serif_count /total), 100.0 * serif_count / total]

plt.figure(figsize=(5,5))
plt.bar([0], serif_dist[1], bottom = serif_dist[0], width = 0.5, color = '#f46542')
plt.bar([0], serif_dist[0], width = 0.5, color = '#41c7f4')
plt.xlim([-0.3, 0.7])
plt.ylim([0,100])
plt.xticks([])
plt.ylabel('Percentage')
plt.title('Use of Serifed Fonts')
plt.legend(['Serif', 'Sans-Serif'], loc='upper right')
plt.savefig('serif_preference.jpg')

# Serifed 'i'
is_serifed_i = [1 if x == 'yes' else 0 for x in serifed_i]
serif_i_weighted = [x[0]*x[1] for x in zip(is_serifed_i, count)]
serif_i_count = sum(serif_i_weighted)
serif_i_dist = [100.0*(1.0 - serif_i_count /total), 100.0 * serif_i_count / total]

plt.figure(figsize=(5,5))
plt.bar([0], serif_i_dist[1], bottom = serif_i_dist[0], width = 0.5, color = '#f46542')
plt.bar([0], serif_i_dist[0], width = 0.5, color = '#41c7f4')
plt.xlim([-0.3, 0.7])
plt.ylim([0,100])
plt.xticks([])
plt.ylabel('Percentage')
plt.title('Use of Serifs on \'i\'')
plt.legend(['Serifed \'i\'', 'Sans-Serif \'i\''], loc='upper right')
plt.savefig('serifed_i_preference.jpg')
