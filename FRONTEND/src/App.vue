<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Ubuntu:400,700");
@import url("https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap");

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app-root {
  height: 100%;
  width: 100%;
}
</style>

<script>
import { mapState } from 'vuex';

import { LOADER_FINISHED } from '@/store/actions/loader.js';
import TdNavbar from '@/components/Navbar.vue';

export default {
    name: 'TdApp',
    components: {
        TdNavbar
    },
    computed: mapState({
        isLoading: (state) => state.loader.loading
    }),
    mounted() {
        this.$store.dispatch(LOADER_FINISHED);
    }
};
</script>
