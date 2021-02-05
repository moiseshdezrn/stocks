<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      Stocks
      <v-spacer></v-spacer>

      <v-btn
        href="#"
        target="_blank"
        text
      >
        <span class="mr-2">Salir</span>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <stock-list/>
    </v-main>
  </v-app>
</template>

<script>
import StockList from './components/StockList.vue';

export default {
  name: 'App',

  components: {
    StockList,
  },

  data: () => ({
  }),
  methods:{
    
  },
};
</script>
